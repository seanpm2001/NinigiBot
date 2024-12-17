import { addMoney } from "../../database/dbServices/user.api.js";
import getBotSubscription from "../discord/getBotSubscription.js";
import globalVars from "../../objects/globalVars.json" with { type: "json"}; import formatName from "../discord/formatName.js";

const subscriberRewardMultiplier = 1.2;

export default async ({ application, userID, reward }) => {
    const baseReward = reward;
    const failMessageObject = { reward: reward, isSubscriber: false };
    let botSubscription = await getBotSubscription(application, userID);
    if (!botSubscription.entitlement) return failMessageObject;
    reward = Math.floor(reward * subscriberRewardMultiplier);
    addMoney(userID, reward);
    let rewardString = `received a bonus ${reward - baseReward}${globalVars.currency} (${subscriberRewardMultiplier * 100 - 100}%) for having ${formatName(botSubscription.SKU.name)}!`;
    return { reward: reward, isSubscriber: true, rewardString: rewardString };
};