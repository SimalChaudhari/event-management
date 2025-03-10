import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

const useDeleteItem = (deleteAction, refreshAction, itemType = 'item') => {
    const dispatch = useDispatch();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (id, name) => {
        setItemToDelete({ id, name });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            setIsDeleting(true);
            try {
                await dispatch(deleteAction(itemToDelete.id));
                toast.success(`${itemType} deleted successfully`);
                setShowDeleteModal(false);
                setItemToDelete(null);
                // Refresh the list
                dispatch(refreshAction());
            } catch (error) {
                toast.error(error.response?.data?.message || `Error deleting ${itemType}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleCloseModal = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    return {
        showDeleteModal,
        itemToDelete,
        isDeleting,
        handleDelete,
        handleConfirmDelete,
        handleCloseModal
    };
};

export default useDeleteItem;