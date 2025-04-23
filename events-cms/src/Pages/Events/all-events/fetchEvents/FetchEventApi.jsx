import { useDispatch } from 'react-redux';
import { eventList,eventDelete } from '../../../../store/actions/eventActions';


export const FetchEventData = () => {
  const dispatch = useDispatch();

  const fetchEvent = async () => {
    await dispatch(eventList());
  };

  const deleteEventData = async (id) => {
    await dispatch(eventDelete(id));
  };

  return { fetchEvent , deleteEventData};
};

