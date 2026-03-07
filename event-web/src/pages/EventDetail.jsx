import { useParams, Link } from 'react-router-dom';

export default function EventDetail() {
  const { id } = useParams();
  return (
    <div className="py-10 px-5 text-center text-slate-500">
      <h2 className="text-xl text-slate-800 mb-2">Event details</h2>
      <p>Event ID: {id}</p>
      <p className="mb-4">Full event page coming soon.</p>
      <Link to="/" className="text-sm font-medium text-primary">← Back to Home</Link>
    </div>
  );
}
