import { resend } from '../resend/client';
import { supabase } from '../supabase/client';

const sendLoginAlert = async (email: string) => {
  const { data, error } = await resend.emails.send({
    from: 'MyLibrary <onboarding@resend.dev>',
    to: email,
    subject: 'Security Alert: New Login to Your MyLibrary Account',
    html: `<p>Hello!</p><p>A new login has been detected on your MyLibrary account. If this was not you, please secure your account immediately.</p>`
  });
  if (error) {
    console.error('Failed to send login alert email:', error);
  }
};

const sendLoanConfirmation = async (email: string, bookTitle: string, dueDate: string) => {
  const { data, error } = await resend.emails.send({
    from: 'MyLibrary <onboarding@resend.dev>',
    to: email,
    subject: `You have borrowed: ${bookTitle}`,
    html: `<p>Hello!</p><p>This is a confirmation that you have successfully borrowed the book "${bookTitle}".</p>
           <p>Your due date is: <strong>${new Date(dueDate).toLocaleDateString()}</strong></p>`
  });
  if (error) {
    console.error('Failed to send loan confirmation email:', error);
  }
};

const sendWishlistAvailableNotification = async (email: string, bookTitle: string) => {
  const { data, error } = await resend.emails.send({
    from: 'MyLibrary <onboarding@resend.dev>',
    to: email,
    subject: `A book on your wishlist is now available!`,
    html: `<p>Hello!</p><p>The book "${bookTitle}" on your wishlist is now available for borrowing. Hurry and get it!</p>`
  });
  if (error) {
    console.error('Failed to send wishlist availability email:', error);
  }
};

// TODO testing
const sendDueDatesReminders = async () => {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const { data: loans, error } = await supabase
    .from('loans')
    .select('*, profiles(email)')
    .eq('returned', false)
    .in('due_date', [threeDaysFromNow.toISOString(), new Date(today.setDate(today.getDate() + 1)).toISOString()]);

  if (error) {
    console.error('Failed to fetch loans for reminders:', error);
    return;
  }

  for (const loan of loans) {
    const { data: book, error: bookError } = await supabase.from('books').select('title').eq('id', loan.book_id).single();
    if (bookError || !book) {
        continue; // Skip if book details cannot be fetched
    }
    await resend.emails.send({
      from: 'MyLibrary <onboarding@resend.dev>',
      to: loan.profiles.email,
      subject: 'MyLibrary Book Due Date Reminder',
      html: `<p>Hello!</p><p>This is a friendly reminder that your borrowed book, "${book.title}", is due on ${new Date(loan.due_date).toLocaleDateString()}.</p>
             <p>Please return it on time to avoid fees.</p>`
    });
  }
};

const sendLoanRequestConfirmation = async (email: string, code: string) => {
  const librarySchedule = "Monday - Friday: 9:00 AM to 5:00 PM; Saturday: 10:00 AM to 2:00 PM.";

  const { data, error } = await resend.emails.send({
    from: 'MyLibrary <onboarding@resend.dev>',
    to: email,
    subject: 'Your MyLibrary Loan Request Confirmation',
    html: `<p>Hello!</p>
           <p>Your request to borrow a book has been successfully received and is currently PENDING admin approval.</p>
           <p>Please present the following unique code at the library desk to complete your loan:</p>
           <h3>Request Code: <strong>${code}</strong></h3>
           <p>Library Schedule: <strong>${librarySchedule}</strong></p>
           <p>You will receive another email once your request is approved and the book is ready for pickup.</p>`
  });
  if (error) {
    console.error('Failed to send loan request confirmation email:', error);
  }
};

const sendLoanRejectedNotification = async (email: string, bookKey: string) => {
  const { data, error } = await resend.emails.send({
    from: 'MyLibrary <onboarding@resend.dev>',
    to: email,
    subject: 'Update: Your Loan Request Was Rejected',
    html: `<p>Hello!</p>
           <p>We regret to inform you that your loan request for book (OL Key: ${bookKey.split('/').pop()}) has been rejected by the administrator.</p>
           <p>This may be due to insufficient available copies or administrative decision.</p>
           <p>You can browse the catalog to check availability.</p>`
  });
  if (error) {
    console.error('Failed to send loan rejected email:', error);
  }
};

export {
  sendLoginAlert,
  sendLoanConfirmation,
  sendWishlistAvailableNotification,
  sendDueDatesReminders,
  sendLoanRequestConfirmation,
  sendLoanRejectedNotification,
};
