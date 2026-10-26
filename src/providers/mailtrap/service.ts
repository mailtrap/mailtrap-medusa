import { Logger, NotificationTypes } from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { MailtrapClient } from "mailtrap"
import type { Mail } from "mailtrap"

type InjectedDependencies = {
  logger: Logger
}

export type MailtrapNotificationOptions = {
  api_key: string
  from: string
  category?: string
}

export class MailtrapNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-mailtrap"
  protected options_: MailtrapNotificationOptions
  protected logger_: Logger
  protected client_: MailtrapClient

  static validateOptions(options: Record<any, any>) {
    if (!options?.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the Mailtrap notification provider",
      )
    }
    if (!options?.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the Mailtrap notification provider",
      )
    }
  }

  constructor(
    { logger }: InjectedDependencies,
    options: MailtrapNotificationOptions,
  ) {
    super()

    this.options_ = options
    this.logger_ = logger
    this.client_ = new MailtrapClient({ token: options.api_key })
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO,
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const attachments = Array.isArray(notification.attachments)
      ? notification.attachments.map((attachment) => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.content_type,
          disposition: attachment.disposition ?? "attachment",
          content_id: attachment.id ?? undefined,
        }))
      : undefined

    const common = {
      from: { email: notification.from?.trim() || this.options_.from },
      to: [{ email: notification.to }],
      attachments,
      custom_variables: notification.provider_data?.custom_variables as
        Record<string, string> | undefined,
    }

    let mail: Mail

    if (notification.content) {
      if (!notification.content.subject) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Mailtrap requires `content.subject` when sending `content`",
        )
      }

      mail = {
        ...common,
        subject: notification.content.subject,
        html: notification.content.html,
        text: notification.content.text,
        category:
          (notification.provider_data?.category as string | undefined) ??
          this.options_.category,
      } as Mail
    } else {
      mail = {
        ...common,
        template_uuid: notification.template,
        template_variables: notification.data as
          Record<string, unknown> | undefined,
      } as Mail
    }

    try {
      const response = await this.client_.send(mail)
      return { id: response.message_ids[0] }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email with Mailtrap: ${error.message}`,
      )
    }
  }
}
