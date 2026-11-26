import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';

import { StarButtonComponent } from './star-button.component';
import { MaterialModule } from '../material.module';
import { AuthService } from '../auth.service';
import { WishlistService } from '../wishlist.service';

describe('StarButtonComponent', () => {
  const someUser = { email: 'a', name: 'a', provider: 'github' };

  function setup(loggedIn: boolean, votes = 5, myVote = false, checked?: Observable<boolean>) {
    const user = signal<typeof someUser | null>(loggedIn ? someUser : null);
    const waitUntilChecked = vi.fn(() => checked ?? of(user() !== null));
    const router = { navigate: vi.fn(), url: '/wishlist?page=2' };
    const wishlist = { vote: vi.fn(), unvote: vi.fn() };
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [StarButtonComponent],
      providers: [
        { provide: AuthService, useValue: { user, waitUntilChecked } },
        { provide: Router, useValue: router },
        { provide: WishlistService, useValue: wishlist }
      ]
    });
    const fixture: ComponentFixture<StarButtonComponent> = TestBed.createComponent(StarButtonComponent);
    fixture.componentRef.setInput('slug', 'foo');
    fixture.componentRef.setInput('votes', votes);
    fixture.componentRef.setInput('myVote', myVote);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, router, wishlist, user, button: el.querySelector('button') as HTMLButtonElement };
  }

  it('logged out: click navigates to /login with returnTo', () => {
    const { button, router, wishlist } = setup(false);
    button.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnTo: '/wishlist?page=2' } });
    expect(wishlist.vote).not.toHaveBeenCalled();
  });

  it('logged in: click increments the count immediately', () => {
    const { fixture, el, button, wishlist } = setup(true, 5, false);
    wishlist.vote.mockReturnValue(new Subject());
    button.click();
    fixture.detectChanges();
    expect(wishlist.vote).toHaveBeenCalledWith('foo');
    expect(el.textContent).toContain('6');
  });

  it('logged in: unvotes when already voted', () => {
    const { fixture, el, button, wishlist } = setup(true, 5, true);
    wishlist.unvote.mockReturnValue(new Subject());
    button.click();
    fixture.detectChanges();
    expect(wishlist.unvote).toHaveBeenCalledWith('foo');
    expect(el.textContent).toContain('4');
  });

  it('logged in: a failed vote rolls the count back and shows an error', () => {
    const { fixture, el, button, wishlist } = setup(true, 5, false);
    wishlist.vote.mockReturnValue(throwError(() => new Error('boom')));
    button.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('5');
    expect(el.querySelector('.star-error')?.textContent).toContain('Could not update your vote');
  });

  it('waits for the initial auth check before deciding the user is logged out', () => {
    const checked = new Subject<boolean>();
    const { fixture, el, button, router, wishlist, user } = setup(false, 5, false, checked);
    wishlist.vote.mockReturnValue(new Subject());
    button.click();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(wishlist.vote).not.toHaveBeenCalled();

    user.set(someUser);
    checked.next(true);
    checked.complete();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(wishlist.vote).toHaveBeenCalledWith('foo');
    expect(el.textContent).toContain('6');
  });

  it('a 401 rolls back and sends the user to /login with returnTo', () => {
    const { fixture, el, button, router, wishlist } = setup(true, 5, false);
    wishlist.vote.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'please log in again' } })));
    button.click();
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnTo: '/wishlist?page=2' } });
    expect(el.textContent).toContain('5');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('a 429 shows the server message and rolls back', () => {
    const { fixture, el, button, router, wishlist } = setup(true, 5, false);
    wishlist.vote.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429, error: { message: 'too many votes, try again shortly' } })));
    button.click();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(el.textContent).toContain('5');
    expect(el.querySelector('.star-error')?.textContent).toContain('too many votes, try again shortly');
  });

  it('a 400 prefers the error field of the server body', () => {
    const { fixture, el, button, wishlist } = setup(true, 5, false);
    wishlist.vote.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'bad slug' } })));
    button.click();
    fixture.detectChanges();
    expect(el.querySelector('.star-error')?.textContent).toContain('bad slug');
  });

  it('busy is cleared once the request finishes', () => {
    const { fixture, button, wishlist } = setup(true, 5, false);
    const sub = new Subject<{ votes: number; myVote: boolean }>();
    wishlist.vote.mockReturnValue(sub);
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    sub.next({ votes: 6, myVote: true });
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('emits changed with the server result', () => {
    const { fixture, button, wishlist } = setup(true, 5, false);
    const sub = new Subject<{ votes: number; myVote: boolean }>();
    wishlist.vote.mockReturnValue(sub);
    const emitted: unknown[] = [];
    fixture.componentInstance.changed.subscribe(v => emitted.push(v));
    button.click();
    sub.next({ votes: 9, myVote: true });
    fixture.detectChanges();
    expect(emitted).toEqual([{ votes: 9, myVote: true }]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('9');
  });
});
