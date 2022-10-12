const extractErrorMessage = (error: any) => {
  if (error?.data?.message) {
    return JSON.stringify(error.data.message);
  } else if (error?.response?.data?.message) {
    return JSON.stringify(error.response.data.message);
  } else if (error?.response?.data?.error) {
    return error.response.data.error;
  } else if (error?.message) {
    return JSON.stringify(error.message);
  } else {
    return error;
  }
};

export default extractErrorMessage;
