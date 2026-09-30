const API_URL = "http://localhost:5000/api/interviews";

export const createInterview = async (token: string) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};


export const getInterviewByCode = async (
  token: string,
  roomCode: string
) => {
  const response = await fetch(
    `${API_URL}/${roomCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};


export const startInterview = async (
  token: string,
  interviewId: string
) => {
  const response = await fetch(
    `${API_URL}/${interviewId}/start`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

export const selectInterviewProblem = async (
  token: string,
  interviewId: string,
  problemId: string
) => {
  const response = await fetch(
    `${API_URL}/${interviewId}/problem`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problemId,
      }),
    }
  );

  return response.json();
};