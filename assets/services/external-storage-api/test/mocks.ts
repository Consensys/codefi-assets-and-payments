export const getMockedItem = (tenantId, resourceId) => ({
  id: resourceId,
  tenantId,
  content: JSON.stringify({ test: "EXISTING RESOURCE" }),
  createdAt: new Date(),
  updatedAt: new Date(),
  contentType: "application/json",
});

export const getMockedFile = (content): Partial<Express.Multer.File> => ({
  mimetype: "application/json",
  fieldname: "fake",
  originalname: "fakeFile",
  stream: undefined,
  buffer: Buffer.from(
    JSON.stringify({ file: content ? content : { value: "fakeContent" } })
  ),
});
