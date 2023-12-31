// NOT USED AT THE MOMENT
const template = /*html*/`
<div>
  <h1>Navbar</h1>
  <router-link :to="{ path: '/dashboard' }">Dashboard</router-link>
  <router-link :to="{ path: '/admin' }">Admin</router-link>
  <a class="button is-light" @click="logout">Logout</a>
</div>
`
import { statex } from '../store.js'
const { onMounted } = Vue
const { useRouter } = VueRouter

export default {
  template,
  setup() {
    const router = useRouter()

    onMounted(async () => {
      console.log('Navbar mounted!')
    })
    const logout = () => {
      statex.user = null
      router.push('/') // if /dashboard should be kicked back to / 
    }
    return {
      logout
    }
  }
}
