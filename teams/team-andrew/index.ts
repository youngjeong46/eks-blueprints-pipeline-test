import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { ApplicationTeam } from '@aws-quickstart/eks-blueprints';

export class TeamAndrew extends ApplicationTeam {
    constructor(scope: Construct, account: string, username: string, teamManifestDir: string) {
        super({
            name: "andrew",
            users: [new ArnPrincipal(`arn:aws:iam::${account}:user/${username}`)],
            teamManifestDir: teamManifestDir
        });
    }
}