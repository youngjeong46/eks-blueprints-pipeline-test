import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';

export class TeamYoung extends ApplicationTeam {
    constructor(scope: Construct, account: string, username: string, teamManifestDir: string) {
        super({
            name: "young",
            users: [new ArnPrincipal(`arn:aws:iam::${account}:user/${username}`)],
            teamManifestDir: teamManifestDir
        });
    }
}