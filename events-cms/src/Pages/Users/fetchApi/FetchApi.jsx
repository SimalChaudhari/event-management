import { useDispatch } from 'react-redux';
import { deleteUser, userList } from '../../../store/actions/userActions';


export const FetchUsers = () => {
  const dispatch = useDispatch();

  const fetchData = async () => {
    await dispatch(userList());
  };

  const deleteUserData = async (id) => {
    await dispatch(deleteUser(id));
  };

  return { fetchData , deleteUserData};
};

