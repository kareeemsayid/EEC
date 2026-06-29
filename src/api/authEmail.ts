let _currentUserEmail = '';

export function setApiUserEmail(email: string) {
  _currentUserEmail = email;
}

export function getApiUserEmail(): string {
  return _currentUserEmail;
}
