CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "citizen_id" INTEGER NOT NULL,
    "responder_unit" "ResponderUnit" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_conversations_citizen_id_responder_unit_key" ON "chat_conversations"("citizen_id", "responder_unit");
CREATE INDEX "chat_conversations_responder_unit_updated_at_idx" ON "chat_conversations"("responder_unit", "updated_at");
CREATE INDEX "chat_messages_conversation_id_created_at_id_idx" ON "chat_messages"("conversation_id", "created_at", "id");

ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
