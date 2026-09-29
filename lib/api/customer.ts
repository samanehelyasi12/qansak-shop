/**
 * The signed-in customer's own profile and address.
 *
 * There is no id in any of these calls. The owner comes from the session, so a
 * request cannot name somebody else's customer or address.
 */

import { apiClient } from "./client";

export interface CustomerProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  referral_code: string;
  is_registered: boolean;
  address: string;
}

export interface Address {
  address: string;
}

export const customerApi = {
  profile: (): Promise<CustomerProfile> =>
    apiClient.get<CustomerProfile>("/api/customer/"),

  /**
   * The current address, or `null` when none has been set yet.
   *
   * This is a read: it never creates anything. The backend deliberately leaves
   * a customer without an address until one is actually provided.
   */
  address: async (): Promise<Address | null> => {
    try {
      return await apiClient.get<Address>("/api/customer/address/");
    } catch (error) {
      if (error instanceof Error && (error as { status?: number }).status === 404) {
        return null;
      }
      throw error;
    }
  },

  /** Creates the address if there is none, otherwise updates the same row. */
  saveAddress: (address: string): Promise<Address> =>
    apiClient.put<Address>("/api/customer/address/", { address }),
};
