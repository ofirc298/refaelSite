'use client'

import { useEffect } from 'react'

/**
 * מאזין גלובלי אופציונלי — שומר תאימות לדברים עתידיים.
 * אם אתה משתמש רק ב-<NavCartLink/> לא חייבים אותו.
 */
export default function CartBadgeListener(){
  useEffect(()=>{
    const onPing = () => {}
    window.addEventListener('cart_add', onPing)
    return () => window.removeEventListener('cart_add', onPing)
  },[])
  return null
}
