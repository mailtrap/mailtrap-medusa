# mailtrap-medusa

Mailtrap Email API notification provider for Medusa. Requires Medusa 2.22 or a newer 2.x release.

## Prerequisites

- A Mailtrap account
- A [verified sending domain](https://docs.mailtrap.io/email-api-smtp/setup/sending-domain)
- An API token for that domain

## Install

```bash
npm install mailtrap-medusa
```

## Configure

Add the provider to the Notification Module in `medusa-config.ts`:

```ts
module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "mailtrap-medusa/providers/mailtrap",
            id: "mailtrap",
            options: {
              channels: ["email"],
              api_key: process.env.MAILTRAP_API_KEY,
              from: process.env.MAILTRAP_FROM,
            },
          },
        ],
      },
    },
  ],
})
```

And set the environment variables in `.env`:

```
MAILTRAP_API_KEY=
MAILTRAP_FROM=
```

`MAILTRAP_FROM` must be an address on your verified domain. Only one provider can handle a channel, so remove `notification-local` from the `email` channel if it is configured.

### Options

| Option     | Required | Description                                                                         |
| ---------- | -------- | ----------------------------------------------------------------------------------- |
| `api_key`  | yes      | Mailtrap API token.                                                                 |
| `from`     | yes      | Default sender address. `notification.from` overrides it.                           |
| `category` | no       | Default category for emails sent with `content` (not used for template emails).     |

## Sending

With a Mailtrap template: `template` is the template UUID and `data` holds the template variables.

```ts
import { Modules } from "@medusajs/framework/utils"

const notificationModuleService = container.resolve(Modules.NOTIFICATION)

await notificationModuleService.createNotifications({
  to: "customer@example.com",
  channel: "email",
  template: "<template-uuid>",
  data: { name: "Ada" },
})
```

Or inline, with `content`:

```ts
await notificationModuleService.createNotifications({
  to: "customer@example.com",
  channel: "email",
  template: "order-placed",
  content: {
    subject: "Your order",
    html: "<p>Thanks for your order.</p>",
    text: "Thanks for your order.",
  },
})
```

### `provider_data`

- `category`: category of the email, up to 255 characters. Shown in Mailtrap Email Logs and Stats. Ignored for template emails, which carry their own category.
- `custom_variables`: map of string values, up to 1000 bytes in total. Shown in Mailtrap Email Logs.

## Errors

A failed send throws `Failed to send email with Mailtrap: <API message>` and the notification is marked as failed.

## Links

- [Mailtrap Email API](https://docs.mailtrap.io/developers/email-sending/transactional/send-transactional-email)
- [Medusa Notification Module](https://docs.medusajs.com/resources/infrastructure-modules/notification)

## License

MIT
