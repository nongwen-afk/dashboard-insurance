export type PolicyStatus = 'ACTIVE' | 'WARNING' | 'EXPIRED';

export interface InsurancePolicy {
  policyNo: string;
  licenseNo: string;
  vehicleMake: string;
  endDate: string;
  premiumAmount: number;
  status: PolicyStatus;
}