import { useDispatch } from 'react-redux';
import { deleteUser, userList, uploadCsvUsers, downloadSampleCsv, exportUsers } from '../../../store/actions/userActions';

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

  const uploadCsvData = async (csvData) => {
    try {
      const result = await dispatch(uploadCsvUsers(csvData));
      return result;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  };

  const downloadCsvSample = async () => {
    try {
      const success = await dispatch(downloadSampleCsv());
      return success;
    } catch (error) {
      console.error('Error downloading sample CSV:', error);
      throw error;
    }
  };

  const exportUsersData = async () => {
    try {
      const success = await dispatch(exportUsers());
      return success;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  };

  return { fetchData, deleteUserData, uploadCsvData, downloadCsvSample, exportUsersData };
};

