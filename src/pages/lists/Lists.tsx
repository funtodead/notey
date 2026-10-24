import { useIonRouter } from '@ionic/react'
import { useState } from 'react'

import { Page } from '../../components/layout/Page'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState, TrySaying } from '../../components/ui/EmptyState'
import { IconButton } from '../../components/ui/IconButton'
import { useListActions } from '../../hooks/useListActions'
import { useStore } from '../../hooks/useStore'
import { ListSheet } from './ListSheet'
import { ListsArt } from './ListsArt'
import { ListTile } from './ListTile'
import './Lists.css'

export default function Lists() {
  const router = useIonRouter()
  const { lists, listItems } = useStore().state
  const actions = useListActions()
  const [creating, setCreating] = useState(false)

  return (
    <Page>
      <PageHeader
        eyebrow={lists.length ? `${lists.length} ${lists.length === 1 ? 'list' : 'lists'}` : 'Nothing yet'}
        title="Lists"
        end={<IconButton icon="plus" label="New list" onClick={() => setCreating(true)} />}
      />

      {lists.length === 0 ? (
        <EmptyState
          art={<ListsArt />}
          title="No lists yet"
          text="Shopping, packing, books to read — say what goes on a list and Notey creates it for you."
          hint="Tap the mic to start a list"
        >
          <TrySaying examples={['add milk to shopping', 'pack sunscreen for the trip']} />
        </EmptyState>
      ) : (
        <>
          <div className="lists">
            {lists.map((list) => (
              <ListTile
                key={list.id}
                list={list}
                items={listItems.filter((i) => i.listId === list.id)}
                onOpen={() => router.push(`/lists/${list.id}`)}
                onDelete={() => actions.remove(list)}
              />
            ))}
          </div>
          <p className="lists-note">Notey creates a list, with a color and emoji, when you mention one.</p>
        </>
      )}

      <ListSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(fields) => {
          const list = actions.create(fields)
          router.push(`/lists/${list.id}`)
        }}
      />
    </Page>
  )
}
