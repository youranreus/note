/**
 * @author 季悠然
 * @date 2022-04-11
 */

import { useEffect, useState } from 'react'
import { Card } from '@douyinfe/semi-ui'
import { useNavigate } from 'react-router-dom'
import { GetNote } from '../api/note'

function NoteItem(props) {
  const { type, nid } = props
  const { Meta } = Card
  const his = useNavigate()
  const [data, setData] = useState('加载中')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (type === 'local') {
      setData(localStorage.getItem(nid))
      setLoading(false)
    } else {
      GetNote(nid).then((res) => {
        setData(res.data.content.content)
        setLoading(false)
      })
    }
  }, [nid, type])

  const jump = () => {
    his('/' + (type === 'online' ? 'o/' : 'l/') + nid)
  }

  return (
    <Card loading={loading} className={'item'}>
      <Meta title={nid} />
      <p onClick={jump}>{data}</p>
    </Card>
  )
}

export default NoteItem
