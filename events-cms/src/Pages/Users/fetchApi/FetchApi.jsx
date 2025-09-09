import { useDispatch } from 'react-redux';
import { deleteUser, userList } from '../../../store/actions/userActions';

export const FetchUsers = () => {
  const dispatch = useDispatch();

  const fetchData = async (roleFilter = null) => {
    try {
      await dispatch(userList(roleFilter));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const deleteUserData = async (id) => {
    try {
      const success = await dispatch(deleteUser(id));
      return success;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  return { fetchData, deleteUserData };
};

