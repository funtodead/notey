import { IonActionSheet, useIonRouter } from '@ionic/react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Page } from '../../components/layout/Page'
import { Icon } from '../../components/ui/Icon'
import { IconButton } from '../../components/ui/IconButton'
import { useListActions } from '../../hooks/useListActions'
import { useStore } from '../../hooks/useStore'
import { ListItemRow } from './ListItemRow'
import { ListSheet } from './ListSheet'
import './ListDetail.css'

export default function ListDetail() {
  const { id } = useParams()
  const router = useIonRouter()
  const { lists, listItems } = useStore().state
  const actions = useListActions()
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const list = lists.find((l) => l.id === id)
  const back = () => router.push('/lists', 'back', 'pop')
  if (!list) return <Page>{null}</Page>

  const items = listItems.filter((i) => i.listId === list.id)
  const open = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  const add = () => {
    if (!text.trim()) return
    actions.addItem(list, text.trim())
    setText('')
  }

  return (
    <Page>
      <div className={`list-detail tone-${list.color}`}>
        <header className="list-detail-bar">
          <IconButton icon="back" label="Back to Lists" onClick={back} />
          <IconButton icon="more" label="List options" onClick={() => setMenuOpen(true)} />
        </header>

        <div className="list-detail-title">
          <span className="list-detail-emoji clay-tint" aria-hidden="true">
            {list.emoji}
          </span>
          <div>
            <h1>{list.name}</h1>
            <p>
              {items.length} {items.length === 1 ? 'item' : 'items'} · {open.length} left
              {list.byNotey && ' · Created by Notey'}
            </p>
          </div>
        </div>

        <form
          className="list-detail-add"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <label htmlFor="list-add" className="visually-hidden">
            Add an item
          </label>
          <input
            id="list-add"
            className="clay-pressed"
            placeholder="Add an item…"
            enterKeyHint="done"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" aria-label="Add item" onPointerDown={(e) => e.preventDefault()}>
            <Icon name="plus" size={22} strokeWidth={2.8} />
          </button>
        </form>

        {open.length > 0 && (
          <>
            <h2 className="list-detail-section">To get · {open.length}</h2>
            <div className="list-detail-items">
              {open.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => actions.toggleItem(item)}
                  onDelete={() => actions.removeItem(item)}
                />
              ))}
            </div>
          </>
        )}

        {done.length > 0 && (
          <>
            <div className="list-detail-section">
              <h2>Done · {done.length}</h2>
              <button onClick={() => actions.clearDone(done)}>Clear done</button>
            </div>
            <div className="list-detail-items">
              {done.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => actions.toggleItem(item)}
                  onDelete={() => actions.removeItem(item)}
                />
              ))}
            </div>
          </>
        )}

        {items.length === 0 && <p className="list-detail-empty">Nothing on this list yet.</p>}
      </div>

      <IonActionSheet
        isOpen={menuOpen}
        header={list.name}
        onDidDismiss={() => setMenuOpen(false)}
        buttons={[
          { text: 'Edit list', handler: () => setEditing(true) },
          {
            text: 'Delete list',
            role: 'destructive',
            handler: () => {
              actions.remove(list)
              back()
            },
          },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />

      <ListSheet open={editing} list={list} onClose={() => setEditing(false)} onSave={(f) => actions.update(list, f)} />
    </Page>
  )
}
