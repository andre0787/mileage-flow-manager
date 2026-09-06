import { baseApi } from "@/features/api/baseApi";
import { getVendasEndpoint } from "./getVendas";
import { addVendaEndpoint } from "./addVenda";
import { updateVendaEndpoint } from "./updateVenda";
import { cancelVendaEndpoint } from "./cancelVenda";
import { deleteVendaEndpoint } from "./deleteVenda";
import { receiveVendaEndpoint } from "./receiveVenda";
import { refundToCreditEndpoint } from "./refundToCredit";

export const vendasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getVendasEndpoint(builder),
    ...addVendaEndpoint(builder),
    ...updateVendaEndpoint(builder),
    ...cancelVendaEndpoint(builder),
    ...deleteVendaEndpoint(builder),
    ...receiveVendaEndpoint(builder),
    ...refundToCreditEndpoint(builder),
  }),
});
