export const SocketUtils = {
  room: {
    roomIdLenght: 5,
    createRandomId: () => {
      const characters = '0123456789abcdefghijklmnopqrstuvwxyz'; // characters used in string
      let result = ''; // initialize the result variable passed out of the function
      for (let i = SocketUtils.room.roomIdLenght; i > 0; i--) {
        result += characters[Math.floor(Math.random() * characters.length)];
      }
      return result;
    },
  },
};
