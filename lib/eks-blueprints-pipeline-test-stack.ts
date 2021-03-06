import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import * as blueprints from '@aws-quickstart/eks-blueprints';

import * as teams from '../teams';


const youngManifestDir = './teams/team-young/manifests/';
const andrewManifestDir = './teams/team-andrew/manifests/';
const teamManifestDirList = [andrewManifestDir, youngManifestDir];

export default class PipelineConstruct extends Construct{
  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope,id)

    const account = props?.env?.account!;
    const region = props?.env?.account!;
    const prodAccount = this.node.tryGetContext("prod-account");

    const hostedZoneName = blueprints.utils.valueFromContext(this, "hosted-zone-name", "example.com");

    // Customized Cluster Provider
    const clusterProvider = new blueprints.GenericClusterProvider({
      version: eks.KubernetesVersion.V1_21,
      managedNodeGroups: [
        {
          id: "mng-1",
          amiType: eks.NodegroupAmiType.AL2_X86_64,
          instanceTypes: [new ec2.InstanceType('m5.2xlarge')],
          nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
        },
        {
          id: "spot-1",
          instanceTypes: [
            new ec2.InstanceType('t2.xlarge'),
            new ec2.InstanceType('t3.xlarge'),
            new ec2.InstanceType('t3.small'),
          ],
          nodeGroupCapacityType: eks.CapacityType.SPOT,
        }
      ]
    });

    // Blueprint definition
    const blueprint = blueprints.EksBlueprint.builder()
    .account(account)
    .resourceProvider(hostedZoneName, new blueprints.LookupHostedZoneProvider(hostedZoneName))
    .clusterProvider(clusterProvider)
    .region(region)
    .enableControlPlaneLogTypes(this.node.tryGetContext('control-plane-log-types'))
    .addOns(
      new blueprints.addons.ExternalDnsAddOn({
        hostedZoneResources: [hostedZoneName]
      })
    )
    .teams(
      new teams.TeamPlatform(account),
      new teams.TeamAndrew(this, account, 'andrew', teamManifestDirList[0]),
      new teams.TeamYoung(this, account, 'young', teamManifestDirList[1]),
    );

    const repoUrl = 'https://github.com/youngjeong46/eks-blueprints-workloads-test';

    const bootstrapRepo: blueprints.ApplicationRepository = {
      repoUrl,
      targetRevision: 'main',
    }

    const devBootstrapArgo = new blueprints.ArgoCDAddOn({
      bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/dev',
      }
    });

    const prodBootstrapArgo = new blueprints.ArgoCDAddOn({
      bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/prod',
      }
    });

    // Blueprints pipeline
    blueprints.CodePipelineStack.builder()
      .name("eks-blueprints-pipeline-test")
      .owner("youngjeong46")
      .repository({
          repoUrl: 'eks-blueprints-pipeline-test',
          credentialsSecretName: 'github-token', // Secrets Manager - predefined
          targetRevision: 'main'
      })
      .wave({
        id: 'dev',
        stages: [
          { id: "dev-1", stackBuilder: blueprint.clone('us-west-2').addOns(devBootstrapArgo)},
        ]
      })
      .wave({
        id: "prod",
        stages: [
          { id: "west-1", stackBuilder: blueprint.clone('us-east-1').addOns(prodBootstrapArgo)},
        ]
      })
      .build(scope, id+'-stack', props);
  }
}