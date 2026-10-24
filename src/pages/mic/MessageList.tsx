import { Icon } from '../../components/ui/Icon'
import type { MicSession } from '../../hooks/useMicSession'
import type { EntityRef } from '../../types/models'
import { FiledResult } from './FiledResult'
import { FiledRow, RemovedRow } from './FiledRow'

interface MessageListProps {
  session: MicSession
  onEdit: (messageId: string, ref: EntityRef) => void
  onDone: () => void
}

/** What was said and what got filed. The latest result shows as a full card until the sheet is reopened. */
export function MessageList({ session, onEdit, onDone }: MessageListProps) {
  const { messages, phase } = session

  return messages.map((message, index) => {
    if (message.role === 'user') {
      return [
        <p key={message.id} className="mic-bubble">
          {message.text}
        </p>,
        message.kept && (
          <span key={`${message.id}-kept`} className="mic-kept">
            <Icon name="clock" size={14} strokeWidth={2.4} />
            Saved · not sent yet
          </span>
        ),
      ]
    }

    if (phase === 'filed' && index === messages.length - 1) {
      return (
        <FiledResult
          key={message.id}
          refs={message.refs}
          removed={message.removed}
          onEdit={(ref) => onEdit(message.id, ref)}
          onUndoAll={() => session.undoAll(message.id)}
          onDone={onDone}
        />
      )
    }

    return (
      <div key={message.id} className="mic-card mic-history">
        {message.refs.map((ref) => (
          <FiledRow key={ref.id} entity={ref} compact onClick={() => onEdit(message.id, ref)} />
        ))}
        {message.removed.map((summary, i) => (
          <RemovedRow key={i} summary={summary} compact />
        ))}
      </div>
    )
  })
}
