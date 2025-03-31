const multerMock = jest.fn().mockImplementation(() => {
  return {
    single: () => (req, res, next) => {
      // Simulate the req.file object that multer would create
      req.file = {
        filename: 'test-image.jpg',
        path: '/uploads/test-image.jpg',
        mimetype: 'image/jpeg',
        size: 12345
      };
      next();
    }
  };
});

module.exports = multerMock;