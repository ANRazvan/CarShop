import { TextEncoder, TextDecoder } from 'util';

import React from 'react';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

export default {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy"
    }
  };
  
// filepath: d:\Faculty\MPP\CarShop\jest.setup.js
import '@testing-library/jest-dom';