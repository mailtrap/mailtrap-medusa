import { MailtrapClient } from "mailtrap"
import { MailtrapNotificationService } from "../service"

jest.mock("mailtrap", () => ({
  MailtrapClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ success: true, message_ids: ["mt-1"] }),
  })),
}))

const logger = {} as any

const createService = (options: Record<string, any> = {}) =>
  new MailtrapNotificationService(logger, {
    api_key: "token",
    from: "default@example.com",
    ...options,
  })

const sentMail = (service: MailtrapNotificationService) =>
  (service as any).client_.send.mock.calls[0][0]

describe("MailtrapNotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates the client with the api key", () => {
    createService()

    expect(MailtrapClient).toHaveBeenCalledWith({ token: "token" })
  })

  it("sends a template notification", async () => {
    const service = createService()

    const result = await service.send({
      to: "customer@example.com",
      channel: "email",
      template: "template-uuid",
      data: { name: "Ada" },
    })

    expect(result).toEqual({ id: "mt-1" })
    const mail = sentMail(service)
    expect(mail.template_uuid).toBe("template-uuid")
    expect(mail.template_variables).toEqual({ name: "Ada" })
    expect(mail.from).toEqual({ email: "default@example.com" })
    expect(mail.to).toEqual([{ email: "customer@example.com" }])
    expect(mail).not.toHaveProperty("subject")
  })

  it("sends a content notification", async () => {
    const service = createService({ category: "default-category" })

    await service.send({
      to: "customer@example.com",
      channel: "email",
      from: " sender@example.com ",
      template: "ignored",
      content: { subject: "Hello", html: "<p>Hi</p>", text: "Hi" },
      attachments: [
        {
          content: "YWJj",
          filename: "a.txt",
          content_type: "text/plain",
        },
      ],
      provider_data: { custom_variables: { order_id: "1" } },
    })

    const mail = sentMail(service)
    expect(mail).toMatchObject({
      from: { email: "sender@example.com" },
      to: [{ email: "customer@example.com" }],
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
      category: "default-category",
      custom_variables: { order_id: "1" },
      attachments: [
        {
          content: "YWJj",
          filename: "a.txt",
          type: "text/plain",
          disposition: "attachment",
        },
      ],
    })
    expect(mail).not.toHaveProperty("template_uuid")

    const override = createService({ category: "default-category" })
    await override.send({
      to: "customer@example.com",
      channel: "email",
      content: { subject: "Hello", html: "<p>Hi</p>" },
      provider_data: { category: "override" },
    })
    expect(sentMail(override).category).toBe("override")
  })

  it("rejects content without a subject", async () => {
    const service = createService()

    await expect(
      service.send({
        to: "customer@example.com",
        channel: "email",
        content: { html: "<p>Hi</p>" } as any,
      }),
    ).rejects.toThrow("content.subject")
    expect((service as any).client_.send).not.toHaveBeenCalled()
  })

  it("wraps client errors", async () => {
    const service = createService()
    ;(service as any).client_.send.mockRejectedValue(new Error("Unauthorized"))

    await expect(
      service.send({
        to: "customer@example.com",
        channel: "email",
        template: "template-uuid",
      }),
    ).rejects.toThrow("Failed to send email with Mailtrap: Unauthorized")
  })

  it("validates required options", () => {
    expect(() =>
      MailtrapNotificationService.validateOptions({ from: "a@example.com" }),
    ).toThrow("api_key")
    expect(() =>
      MailtrapNotificationService.validateOptions({ api_key: "token" }),
    ).toThrow("from")
    expect(() =>
      MailtrapNotificationService.validateOptions({
        api_key: "token",
        from: "a@example.com",
      }),
    ).not.toThrow()
  })
})
