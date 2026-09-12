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