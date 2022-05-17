import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';

export class TeamAndrew extends ApplicationTeam {
    constructor(scope: Construct, account: string, teamname: string) {
        super({
            name: teamname,
            //user: [new ArnPrincipal(`arn:aws:iam::${account}:user/${username}`)],
            userRoleArn: `arn:aws:iam::${account}:role/team-${teamname}-role`,
            // teamManifestDir: teamManifestDir
        });
    }
}