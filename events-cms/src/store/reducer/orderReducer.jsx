import { ORDER_LIST } from "../constants/actionTypes";

const initialState = {
    order: [],
    orderByID: '',
    
 
};
const orderReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case ORDER_LIST:
            return {
                ...state,
                order: payload,
            };
       
        default:
            return state;
    }
};
export default orderReducer;
