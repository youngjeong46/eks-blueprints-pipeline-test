import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';

export class TeamYoung extends ApplicationTeam {
    constructor(scope: Construct, account: string, teamname: string, teamManifestDir: string) {
        super({
            name: teamname,
            //user: [new ArnPrincipal(`arn:aws:iam::${account}:user/${username}`)],
            userRoleArn: `arn:aws:iam::${account}:role/team-${teamname}-role`,
            teamManifestDir: teamManifestDir,
            // namespaceHardLimits: {
            //     'requests.cpu': '10',
            //     'requests.memory': '10Gi',
            //     'limits.cpu': '20',
            //     'limits.memory': '20Gi'
            // }
        });
    }
}