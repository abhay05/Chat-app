const socket=io()

//elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=document.querySelector('input')
const $messageFormButton=document.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $message=document.querySelector('#messages')


//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{

    const $newMessage=$message.lastElementChild
    //The difference between this property and lastChild, is that lastChild returns the last
    //child node as an element node, a text node or a comment node (depending on which one's
    //last), while lastElementChild returns the last child node as an element node (ignores
    //text and comment nodes).

    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin

    const visibleHeight=$message.offsetHeight
    const containerHeight=$message.scrollHeight
    const scrollOffset=$message.scrollTop+visibleHeight

    // getComputedStyle => The computed style is the style actually used in displaying the element, after "stylings" from multiple sources have been applied.
    //                     Style sources can include: internal style sheets, external style sheets, inherited styles and browser default styles

    // offsetHeight => offsetHeight read-only property returns the height of an element, including vertical padding and borders, as an integer.

    // scrollHeight => The scrollHeight property returns the entire height of an element in pixels, including padding, but not the border, scrollbar or margin.

    // https://stackoverflow.com/questions/22675126/what-is-offsetheight-clientheight-scrollheight

    // scrollTop => The scrollTop property sets or returns the number of pixels an element's content is scrolled vertically

    if(containerHeight-newMessageHeight <= scrollOffset){
        $message.scrollTop=$message.scrollHeight
    }

}

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

socket.on('message', (message) => {
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        message:message.text,
        username:message.username,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html=Mustache.render(locationMessageTemplate,{
        url:message.url,
        username:message.username,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener('submit',(e)=>{
    //console.log('Clicked')
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    var message=e.target.elements.message.value
    socket.emit('message',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Your browser does not support geolocation')
    }
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{

        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log("Position Shared")
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

//navigator.geolocation.get