import { WITHDRAWAL_LIST } from "../constants/actionTypes";

const initialState = {
    withdraw: [],
    withdrawByID: '',
    
 
};
const withdrawReducer = (state = initialState, { type, payload } = {}) => {
    switch (type) {
        case WITHDRAWAL_LIST:
            return {
                ...state,
                withdraw: payload,
            };
       
        default:
            return state;
    }
};
export default withdrawReducer;
