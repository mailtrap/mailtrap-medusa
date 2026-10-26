import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { MailtrapNotificationService } from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [MailtrapNotificationService],
})
