import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from './page.module.css';

const RegisterPage = (props) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNum, setPhoneNum] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/user/register', {
        firstName,
        lastName,
        email,
        username,
        password,
        phoneNum
      });
      console.log('Registration successful:', response.data);
    } catch (error) {
      console.error('Error during registration:', error.response.data.message);
    }
  };

  return (
    <>
      <div className={styles['register-page-container']}>
        <Head>
          <title>PalletsPlus - Register</title>
        </Head>
        <div className={styles['register-page-register-page']}>
          <span className={styles['register-page-text']}>
            <span>PalletsPlus</span>
          </span>
          <span className={styles['register-page-text02']}>
            <span>Create an account</span>
          </span>
          <form onSubmit={handleRegister} className={styles['register-form']}>
            <label className={styles['register-page-text04']} htmlFor="firstName">
              First Name:
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <label className={styles['register-page-text06']} htmlFor="lastName">
              Last Name:
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <label className={styles['register-page-text04']} htmlFor="email">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <label className={styles['register-page-text06']} htmlFor="username">
              Username:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <label className={styles['register-page-text08']} htmlFor="password">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <label className={styles['register-page-text08']} htmlFor="phoneNum">
              Phone Number:
            </label>
            <input
              type="text"
              id="phoneNum"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
              className={styles['register-page-input']}
              required
            />
            <button type="submit" className={styles['register-page-button']}>
              Register
            </button>
          </form>
          <span className={styles['register-page-text12']}>
            <span className={styles['register-page-text13']}>
              Already have an account
            </span>
            <span className={styles['register-page-text14']}>
              <span
                dangerouslySetInnerHTML={{
                  __html: ' ',
                }}
              />
            </span>
            <link>Login</link>
          </span>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
