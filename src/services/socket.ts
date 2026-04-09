import { io, Socket } from "socket.io-client";

import { BASE_URL } from "../api/client";

const socket: Socket = io(BASE_URL);

export default socket;
