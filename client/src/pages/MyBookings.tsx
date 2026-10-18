import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookings, cancelBooking } from '../api/elements';
import { createReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import { Badge, statusToVariant } from '../components/ui/Badge';
import { ListRowSkeletonGroup } from '../components/ui/ListRowSkeleton';
import Footer from '../components/Footer';

export default function MyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      setCancelError(null);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      setCancelError(err?.response?.data?.message ?? 'Could not cancel booking.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      setReviewError(null);
      setReviewingId(null);
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      setReviewError(err?.response?.data?.message ?? 'Could not submit review.');
    },
  });

  function openReviewForm(bookingId: string) {
    setReviewingId(bookingId);
    setReviewError(null);
    setRating(5);
    setComment('');
  }

  function submitReview(bookingId: string) {
    reviewMutation.mutate({ bookingId, rating, comment: comment || null });
  }

  const isUpcoming = (endTime: string) => new Date(endTime) > new Date();

  const isReviewEligible = (booking: { status: string; endTime: string; hasReview: boolean }) =>
    booking.status !== 'Cancelled' && new Date(booking.endTime) < new Date() && !booking.hasReview;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>{' '}
            to see your bookings.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My bookings</h1>

        {cancelError && (
          <p className="mt-4 text-sm text-amber-600">{cancelError}</p>
        )}

        <div className="mt-8">
          {isLoading && <ListRowSkeletonGroup count={3} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load your bookings</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && bookings?.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">You have no bookings yet</p>
              <p className="mt-1 text-sm text-slate-500">
                <Link to="/Categories" className="font-medium text-indigo-600 hover:underline">
                  Browse categories
                </Link>{' '}
                to find something to book.
              </p>
            </div>
          )}

          {!isLoading && !error && bookings && bookings.length > 0 && (
            <ul className="space-y-4">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/elements/${booking.elementId}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {booking.elementName}
                      </Link>
                      <p className="text-sm text-slate-500">{booking.serviceName}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}
                      </p>
                    </div>

                    <Badge variant={statusToVariant(booking.status)}>{booking.status}</Badge>
                  </div>

                  {booking.status === 'Confirmed' && isUpcoming(booking.startTime) && (
                    <button
                      onClick={() => cancelMutation.mutate(booking.id)}
                      disabled={cancelMutation.isPending}
                      className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    >
                      Cancel booking
                    </button>
                  )}

                  {isReviewEligible(booking) && (
                    <div className="mt-3">
                      {reviewingId === booking.id ? (
                        <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className={`text-lg ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Optional comment"
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitReview(booking.id)}
                              disabled={reviewMutation.isPending}
                              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {reviewMutation.isPending ? 'Submitting...' : 'Submit review'}
                            </button>
                            <button
                              onClick={() => setReviewingId(null)}
                              className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                          </div>
                          {reviewError && <p className="text-xs text-amber-600">{reviewError}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => openReviewForm(booking.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Leave a review
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}