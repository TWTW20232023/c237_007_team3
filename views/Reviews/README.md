# Reviews

## Feature Owner

Not originally assigned to anyone in the team plan — built by Hazirah as an addition, open for anyone to help extend.

## Purpose

Users can view and leave reviews for individual books - a star rating (1-5) plus an optional comment.

## Where it lives in the app

Not a standalone navbar item - reviews are attached to specific books, so they're reached by clicking a book's title:
- From the Book List (`/catalog`) - each book title links to `/reviews/:bookId`
- From the Dashboard's recommendation sections - same, each recommended book title links there too

A generic "Reviews" navbar link showing every review across every book wasn't included on purpose - a wall of unrelated reviews isn't that useful without book context.

## Routes

- `GET /reviews/:bookId` - view a book's average rating + all reviews. Public, no login required to read.
- `POST /reviews/:bookId` - submit a new review. Requires login (`authMiddleware`).

## Database

`database/reviewSchema.sql` - proposed `reviews` table (`review_id`, `user_id`, `book_id`, `rating`, `comment`, `created_at`). Not yet run against the shared database - needs to be, same as the other schema files.

## Still open

- No edit/delete for your own review yet - anyone can only add, not change or remove
- No protection against the same user reviewing the same book multiple times
- No pagination if a book ends up with a lot of reviews
