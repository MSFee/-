let str = 'asd ff dfsf gfgf_info user_info sdasd'

str.replace(/\w+_info/g, (a) => {
    console.log(a)
})