import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import * as blueprints from '@aws-quickstart/eks-blueprints';

import * as teams from '../teams';
// import { GlobalResources } from '@aws-quickstart/eks-blueprints';


const youngManifestDir = './teams/team-young/manifests/';
const andrewManifestDir = './teams/team-andrew/manifests/';
const teamManifestDirList = [andrewManifestDir, youngManifestDir];

export default class PipelineConstruct extends Construct{
  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope,id)

    const account = props?.env?.account!;
    const region = props?.env?.account!;

    // const hostedZoneName = blueprints.utils.valueFromContext(this, "hosted-zone-name", "example.com");
    // const prodDomain = blueprints.utils.valueFromContext(this, 'prod-domain','prod.example.com')

    const devClusterProvider = new blueprints.MngClusterProvider({
      id: "prod-nodegroup-1",
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      instanceTypes: [new ec2.InstanceType('m5.2xlarge')],
      nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
      version: eks.KubernetesVersion.V1_28,
      minSize: 1,
      maxSize: 2,
      desiredSize: 2
    });

    // Blueprint definition
    const blueprint = blueprints.EksBlueprint.builder()
    .version(eks.KubernetesVersion.V1_28)
    .account(account)
    // .resourceProvider(hostedZoneName, new blueprints.LookupHostedZoneProvider(hostedZoneName))
    .region(region)
    // .enableControlPlaneLogTypes(this.node.tryGetContext('control-plane-log-types'))
    .addOns(
      new blueprints.addons.AwsLoadBalancerControllerAddOn(),
      new blueprints.addons.KarpenterAddOn({
        version: 'v0.31.0'
      }),
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
      .codeBuildPolicies(blueprints.DEFAULT_BUILD_POLICIES)
      .repository({
          repoUrl: 'eks-blueprints-pipeline-test',
          credentialsSecretName: 'github-token', // Secrets Manager - predefined
          targetRevision: 'main'
      })
      .wave({
        id: 'envs',
        stages: [
          { id: "dev", stackBuilder: blueprint.clone('us-east-1')
            .clusterProvider(devClusterProvider)
            .addOns(devBootstrapArgo)
          },
          { id: "prod", stackBuilder: blueprint.clone('eu-west-1')
            .clusterProvider(devClusterProvider)
            .addOns(prodBootstrapArgo)
          },
        ]
      })
      .build(scope, id+'-stack', props);
  }
}
