import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import roomService from "../services/room.service.js";
import Interview from "../../models/Interview.js";
import Problem from "../../models/Problem.js";

const registerRoomSocket = (io, socket) => {
  // ============================================================
  // INTERVIEWER JOINS INTERVIEW
  // ============================================================

  socket.on(
    "INTERVIEW_JOIN_INTERVIEWER",
    async ({ roomCode, userId, username }) => {
      try {
        console.log(
          "INTERVIEW_JOIN_INTERVIEWER received:",
          {
            roomCode,
            userId,
            username,
          }
        );

        if (!roomCode || !userId || !username) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Room code, user ID and username are required",
          });

          return;
        }

        const interview = await Interview.findOne({
          roomCode: roomCode.toUpperCase(),
        });

        if (!interview) {
          socket.emit("INTERVIEW_ERROR", {
            message: "Interview not found",
          });

          return;
        }

        // Make sure this user actually owns the interview
        if (
          interview.interviewerId.toString() !==
          userId.toString()
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "You are not the interviewer for this interview",
          });

          return;
        }

        if (interview.status !== "waiting") {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "This interview is no longer waiting",
          });

          return;
        }

        // Join the Socket.IO interview room
        socket.join(interview.roomCode);

        // Store interview information on socket
        socket.data.interviewCode =
          interview.roomCode;

        socket.data.interviewInterviewerId =
          userId;

        socket.data.interviewUsername =
          username;

        socket.data.interviewRole =
          "interviewer";

        // Tell interviewer that they successfully joined
        socket.emit(
          "INTERVIEW_INTERVIEWER_JOINED",
          {
            interviewId: interview._id,
            roomCode: interview.roomCode,
            status: interview.status,
          }
        );

        console.log(
          `${username} joined interview ${interview.roomCode} as interviewer`
        );
      } catch (error) {
        console.error(
          "Interviewer join error:",
          error
        );

        socket.emit("INTERVIEW_ERROR", {
          message:
            "Failed to join interview",
        });
      }
    }
  );

  // ============================================================
  // INTERVIEWER SELECTS PROBLEM
  // ============================================================

  socket.on(
    "INTERVIEW_SELECT_PROBLEM",
    async ({
      roomCode,
      interviewId,
      problemId,
    }) => {
      try {
        if (
          !roomCode ||
          !interviewId ||
          !problemId
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Room code, interview ID and problem ID are required",
          });

          return;
        }

        const interview =
          await Interview.findById(
            interviewId
          );

        if (!interview) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Interview not found",
          });

          return;
        }

        // Make sure this socket belongs to
        // the interviewer
        if (
          interview.interviewerId.toString() !==
          socket.data.interviewInterviewerId?.toString()
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Only the interviewer can select a problem",
          });

          return;
        }

        // Make sure the interview is still waiting
        if (
          interview.status !== "waiting"
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Problem cannot be changed after the interview starts",
          });

          return;
        }

        // Find the selected problem
        const problem =
          await Problem.findOne({
            _id: problemId,
            isActive: true,
          });

        if (!problem) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Problem not found",
          });

          return;
        }

        // Make sure the selected problem
        // is attached to this interview
        if (
          !interview.problemId ||
          interview.problemId.toString() !==
            problemId.toString()
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Selected problem does not belong to this interview",
          });

          return;
        }

        const problemData = {
          _id: problem._id,
          title: problem.title,
          description:
            problem.description,
          difficulty:
            problem.difficulty,
          topics: problem.topics,
          examples: problem.examples,
          constraints:
            problem.constraints,
          starterCode:
            problem.starterCode,
        };

        // Broadcast selected problem
        // to everyone in this interview room
        io.to(interview.roomCode).emit(
          "INTERVIEW_PROBLEM_SELECTED",
          {
            interviewId:
              interview._id,
            roomCode:
              interview.roomCode,
            problem: problemData,
          }
        );

        console.log(
          `Problem selected for interview ${interview.roomCode}: ${problem.title}`
        );
      } catch (error) {
        console.error(
          "Interview problem selection socket error:",
          error
        );

        socket.emit("INTERVIEW_ERROR", {
          message:
            "Failed to broadcast selected problem",
        });
      }
    }
  );

  // ============================================================
  // CANDIDATE JOINS INTERVIEW
  // ============================================================

  socket.on(
    "INTERVIEW_JOIN",
    async ({
      roomCode,
      userId,
      username,
    }) => {
      try {
        if (
          !roomCode ||
          !userId ||
          !username
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Room code, user ID and username are required",
          });

          return;
        }

        const interview =
          await Interview.findOne({
            roomCode:
              roomCode.toUpperCase(),
          });

        if (!interview) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "Interview not found",
          });

          return;
        }

        if (
          interview.status !== "waiting"
        ) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "This interview is no longer accepting candidates",
          });

          return;
        }

        if (interview.candidateId) {
          socket.emit("INTERVIEW_ERROR", {
            message:
              "A candidate has already joined this interview",
          });

          return;
        }

        // Store candidate in MongoDB
        interview.candidateId =
          userId;

        await interview.save();

        // Join Socket.IO interview room
        socket.join(
          interview.roomCode
        );

        // Store interview information on socket
        socket.data.interviewCode =
          interview.roomCode;

        socket.data.interviewCandidateId =
          userId;

        socket.data.interviewUsername =
          username;

        socket.data.interviewRole =
          "candidate";

        // Tell candidate that they
        // successfully joined
        socket.emit(
          "INTERVIEW_JOINED",
          {
            interviewId:
              interview._id,
            roomCode:
              interview.roomCode,
            status:
              interview.status,
          }
        );

        // Tell interviewer that
        // candidate joined
        io.to(
          interview.roomCode
        ).emit(
          "INTERVIEW_CANDIDATE_JOINED",
          {
            interviewId:
              interview._id,
            candidateId:
              userId,
            candidateName:
              username,
          }
        );

        console.log(
          `${username} joined interview ${interview.roomCode} as candidate`
        );
      } catch (error) {
        console.error(
          "Interview candidate join error:",
          error
        );

        socket.emit("INTERVIEW_ERROR", {
          message:
            "Failed to join interview",
        });
      }
    }
  );

  // ============================================================
  // EXISTING WORKSPACE ROOM JOIN
  // ============================================================

  socket.on(
    SOCKET_EVENTS.JOIN_ROOM,
    ({ roomId, username }) => {
      if (!roomId || !username) {
        socket.emit(
          SOCKET_EVENTS.SOCKET_ERROR,
          {
            message:
              "Room ID and username are required",
          }
        );

        return;
      }

      socket.join(roomId);

      socket.data.roomId =
        roomId;

      socket.data.username =
        username;

      const user = {
        socketId:
          socket.id,
        username,
        roomId,
      };

      const roomUsers =
        roomService.joinRoom(
          roomId,
          user
        );

      socket.emit(
        SOCKET_EVENTS.ROOM_JOINED,
        {
          roomId,
          user,
        }
      );

      socket.to(roomId).emit(
        SOCKET_EVENTS.USER_JOINED,
        {
          user,
        }
      );

      io.to(roomId).emit(
        SOCKET_EVENTS.ROOM_USERS,
        {
          roomId,
          users: roomUsers,
        }
      );

      console.log(
        `${username} joined room ${roomId}`
      );
    }
  );

  // ============================================================
  // EXISTING WORKSPACE CHAT
  // ============================================================

  socket.on(
    SOCKET_EVENTS.SEND_MESSAGE,
    ({ message }) => {
      const roomId =
        socket.data.roomId;

      const username =
        socket.data.username;

      if (
        !roomId ||
        !message?.trim()
      ) {
        return;
      }

      io.to(roomId).emit(
        SOCKET_EVENTS.RECEIVE_MESSAGE,
        {
          socketId:
            socket.id,
          username,
          message:
            message.trim(),
          timestamp:
            new Date().toISOString(),
        }
      );
    }
  );

  // ============================================================
  // EXISTING WORKSPACE LEAVE
  // ============================================================

  socket.on(
    SOCKET_EVENTS.LEAVE_ROOM,
    () => {
      handleLeaveRoom(
        io,
        socket
      );
    }
  );

  // ============================================================
  // SOCKET DISCONNECT
  // ============================================================

  socket.on(
    "disconnect",
    async () => {
      await handleInterviewDisconnect(
        io,
        socket
      );

      handleLeaveRoom(
        io,
        socket
      );

      console.log(
        `Socket disconnected: ${socket.id}`
      );
    }
  );
};

// ================================================================
// INTERVIEW DISCONNECT HANDLER
// ================================================================

const handleInterviewDisconnect = async (
  io,
  socket
) => {
  const interviewCode =
    socket.data.interviewCode;

  const interviewRole =
    socket.data.interviewRole;

  if (
    !interviewCode ||
    !interviewRole
  ) {
    return;
  }

  try {
    const interview =
      await Interview.findOne({
        roomCode: interviewCode,
      });

    if (!interview) {
      return;
    }

    // ------------------------------------------------------------
    // Candidate disconnected
    // ------------------------------------------------------------

    if (
      interviewRole ===
      "candidate"
    ) {
      const candidateId =
        socket.data
          .interviewCandidateId;

      // Only clear candidate if this
      // socket belongs to currently stored candidate
      if (
        interview.status ===
          "waiting" &&
        interview.candidateId &&
        interview.candidateId
          .toString() ===
          candidateId
      ) {
        interview.candidateId =
          null;

        await interview.save();

        io.to(
          interviewCode
        ).emit(
          "INTERVIEW_CANDIDATE_LEFT",
          {
            interviewId:
              interview._id,
            candidateId,
          }
        );

        console.log(
          `Candidate left interview ${interviewCode}`
        );
      }
    }

    // ------------------------------------------------------------
    // Interviewer disconnected
    // ------------------------------------------------------------

    if (
      interviewRole ===
      "interviewer"
    ) {
      io.to(
        interviewCode
      ).emit(
        "INTERVIEW_INTERVIEWER_LEFT",
        {
          interviewId:
            interview._id,
        }
      );

      console.log(
        `Interviewer left interview ${interviewCode}`
      );
    }
  } catch (error) {
    console.error(
      "Interview disconnect error:",
      error
    );
  }

  // Clear interview socket data
  socket.data.interviewCode =
    null;

  socket.data.interviewInterviewerId =
    null;

  socket.data.interviewCandidateId =
    null;

  socket.data.interviewUsername =
    null;

  socket.data.interviewRole =
    null;
};

// ================================================================
// EXISTING WORKSPACE LEAVE HANDLER
// ================================================================

const handleLeaveRoom = (
  io,
  socket
) => {
  const roomId =
    socket.data.roomId;

  const username =
    socket.data.username;

  if (!roomId) {
    return;
  }

  const remainingUsers =
    roomService.leaveRoom(
      roomId,
      socket.id
    );

  socket.leave(roomId);

  socket.to(roomId).emit(
    SOCKET_EVENTS.USER_LEFT,
    {
      socketId:
        socket.id,
      username,
    }
  );

  io.to(roomId).emit(
    SOCKET_EVENTS.ROOM_USERS,
    {
      roomId,
      users:
        remainingUsers,
    }
  );

  console.log(
    `${username} left room ${roomId}`
  );

  socket.data.roomId =
    null;

  socket.data.username =
    null;
};

export default registerRoomSocket;