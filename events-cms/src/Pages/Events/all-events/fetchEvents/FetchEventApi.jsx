import { useDispatch } from 'react-redux';
import { eventList,eventDelete, upcomingEventList } from '../../../../store/actions/eventActions';


export const FetchEventData = () => {
  const dispatch = useDispatch();

  const fetchEvent = async () => {
    await dispatch(eventList());
    await dispatch(upcomingEventList());

  };

  const deleteEventData = async (id) => {
    await dispatch(eventDelete(id));
  };

  return { fetchEvent , deleteEventData};
};

