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

    // Customized Cluster Provider
    const clusterProvider = new blueprints.GenericClusterProvider({
      version: eks.KubernetesVersion.V1_21,
      managedNodeGroups: [
        {
          id: "mng-1",
          minSize: 1,
          maxSize: 5,
          desiredSize: 2,
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
    .clusterProvider(clusterProvider)
    .region(region)
    .addOns()
    .teams(
      new teams.TeamAndrew(scope, process.env.CDK_DEFAUL_ACCOUNT!, 'jeong', teamManifestDirList[0]), 
      new teams.TeamYoung(scope, process.env.CDK_DEFAUL_ACCOUNT!, 'jeong', teamManifestDirList[1]),
    );

    // const repoUrl = 'https://github.com/aws-samples/eks-blueprints-workloads';

    // const bootstrapRepo: blueprints.ApplicationRepository = {
    //   repoUrl,
    //   targetRevision: 'demo',
    // }

    // const devBootstrapArgo = new blueprints.ArgoCDAddOn({
    //   bootstrapRepo: {
    //     ...bootstrapRepo,
    //     path: 'envs/dev',
    //   }
    // });

    // const testBootstrapArgo = new blueprints.ArgoCDAddOn({
    //   bootstrapRepo: {
    //     ...bootstrapRepo,
    //     path: 'envs/test',
    //   }
    // });

    // const prodBootstrapArgo = new blueprints.ArgoCDAddOn({
    //   bootstrapRepo: {
    //     ...bootstrapRepo,
    //     path: 'envs/prod',
    //   }
    // });
    
    // Blueprints pipeline
    blueprints.CodePipelineStack.builder()
      .name("eks-blueprints-pipeline-test")
      .owner("youngjeong46")
      .repository({
          repoUrl: 'eks-blueprints-pipeline-test',
          credentialsSecretName: 'github-token',
          targetRevision: 'main'
      })
      .wave({
        id: "envs",
        stages: [
          { id: "dev", stackBuilder: blueprint.clone('eu-central-1')},
          { id: "test", stackBuilder: blueprint.clone('eu-west-1')},
        ]
      })
      .build(scope, id+'-stack', props);
  }
}