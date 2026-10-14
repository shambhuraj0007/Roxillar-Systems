function validateUser(data, isSignup = false) {
  const errors = {};

  if (!data.name || data.name.length < 20 || data.name.length > 60) {
    errors.name = 'Name must be between 20 and 60 characters';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (isSignup || data.password) {
    const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;
    if (!passRegex.test(data.password)) {
      errors.password = 'Password must be 8-16 chars with one uppercase and one special character';
    }
  }

  if (data.address && data.address.length > 400) {
    errors.address = 'Address must be under 400 characters';
  }

  return errors;
}

function validatePassword(password) {
  const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;
  return passRegex.test(password);
}

module.exports = { validateUser, validatePassword };
