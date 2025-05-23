import BaseService from '../api-base/BaseService';

import type { PlanManagetype } from "../interface-Types/PlanType";
import type { SubscriptionPlan } from "../../Admin/component/plan/PlanForm";

export default class PlanService extends BaseService {
  public static setAccessToken(authData: { accessToken: string; appUser: string; userId: string }) {
    localStorage.setItem('appUser', JSON.stringify(authData.appUser));
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('userId', authData.userId);
  }

  public static getAppUser() {
    return JSON.parse(localStorage.getItem('appUser') as string);
  }

  public static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  public static getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId !== null ? userId : '';
  }

  static async CreatePlan(plan: PlanManagetype) {
    return BaseService.post<PlanManagetype>('plan/createPlan', plan);
  }

  static async GetPlan() {
    return BaseService.get<SubscriptionPlan[]>('plan/getPlan');
  }

  static async updatePlan(plan: PlanManagetype) {
    return BaseService.put<PlanManagetype>('plan/updatePlan', plan);
  }

  static async deletePlan(id: string) {
    return BaseService.delete<PlanManagetype>(`plan/${id}/deletePlan`);
  }
}
