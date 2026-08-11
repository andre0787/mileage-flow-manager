import { baseApi } from "@/features/api/baseApi";
import { getOwnersEndpoint } from "./getOwners";
import { addOwnerEndpoint } from "./addOwner";
import { updateOwnerEndpoint } from "./updateOwner";
import { deleteOwnerEndpoint } from "./deleteOwner";

export const ownersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getOwnersEndpoint(builder),
    ...addOwnerEndpoint(builder),
    ...updateOwnerEndpoint(builder),
    ...deleteOwnerEndpoint(builder),
  }),
});