import { ArnPrincipal } from 'aws-cdk-lib/aws-iam';
import { PlatformTeam } from '@aws-quickstart/eks-blueprints';

export class TeamPlatform extends PlatformTeam {
    constructor(accountID: string) {
        super({
            name: "platform",
            //user: [new ArnPrincipal(`arn:aws:iam::${account}:user/${username}`)],
            userRoleArn: `arn:aws:iam::${accountID}:role/platform-team-role`,
        })
    }
}