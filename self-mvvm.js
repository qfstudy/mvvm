function Mvvm(options={}){
  this.$options=options
  let data=this._data=this.$options.data
  let dep = observe(data)
  for(let key in data){
    //对对象的每一个属性都进行监听，
    //当对象的某一个属性发生改变或是取某个属性的值的时候触发
    Object.defineProperty(this,key,{
      enumerable: true,
      get: function(){
        return this._data[key] 
      },
      set: function(newVal){
        this._data[key]=newVal
      }
    })
  }
  compile(this.$options.el,this)

  if(typeof options.mounted !== 'undefined'){
    options.mounted.call(this)
  }
  dep.notify()
}

//数据劫持
function Observe(data){
  let dep=new Dep()
  for(let key in data){
    let val=data[key]
    observe(val)
    Object.defineProperty(data,key,{
      enumerable: true,
      get: function(){
        Dep.target && dep.addSub(Dep.target)
        console.log('获取属性值')
        return val
      },
      set: function(newVal){
        if(val===newVal){
          console.log('属性值不变')
          return
        }
        console.log('设置属性值')
        val=newVal 
        dep.notify()
        observe(newVal)
      }
    })
  }
  return dep
}

function observe(data){
  if(typeof data !== 'object'){
    return
  }
  return new Observe(data)
}


//编译
function compile(el,vm){
  vm.$el=document.querySelector(el)
  let fragment=document.createDocumentFragment()
  while(child=vm.$el.firstChild){
    fragment.appendChild(child)
  }
  // console.log(Array.from(fragment.childNodes))
  function replace(frag){
    Array.from(frag.childNodes).forEach(function(node){
      let txt=node.textContent
      // console.log(txt)
      let reg=/\{\{(.*?)\}\}/g
      if(node.nodeType===3 && reg.test(txt)){
        // let val=vm
        // let arrayValKey=RegExp.$1.split('.')
        // console.log(arrayValKey)
        // arrayValKey.forEach(key=>{
        //   val=val[key]
        //   console.log(val)
        // }) 
        // node.textContent=txt.replace(reg,val).trim()
        // node.textContent=txt.replace(reg,function(matched,placeholder){
        //   console.log(placeholder)
        // })
        // console.log(node.textContent)
        // new Watcher(vm,RegExp.$1,function(newVal){
        //   node.textContent=txt.replace(reg,newVal).trim()
        // })

        function replaceTxt(){
          node.textContent=txt.replace(reg,function(matched,placeholder){
            // console.log(placeholder.split('.'))
            new Watcher(vm,placeholder,replaceTxt)
            return placeholder.split('.').reduce((val,key)=>{
              return val[key]
            },vm)
          })
        }
        replaceTxt()
      }

      if(node.nodeType===1){
        let nodeAttr=node.attributes
        Array.from(nodeAttr).forEach(attr=>{
          let name=attr.name
          let exp=attr.value
          // console.log(name,exp)
          if(name.includes('v-')){
            node.value=vm[exp]
          }
          new Watcher(vm,exp,function(newVal){
            node.value=newVal
          })
          node.addEventListener('input',e=>{
            let newVal=e.target.value
            vm[exp]=newVal
          })
        })
      }
      if(node.childNodes && node.childNodes.length){
        replace(node)
      }
    })
  }
  replace(fragment)
  vm.$el.appendChild(fragment)
}


//发布订阅
function Dep(){
  this.subs=[]
}
Dep.prototype.addSub=function(sub){
  this.subs.push(sub)
}
Dep.prototype.notify=function(){
  // console.log(this.subs)
  this.subs.length && this.subs.forEach(sub=>sub.update())
}

function Watcher(vm,exp,fn){ 
  this.vm=vm
  this.exp=exp
  this.fn=fn
  Dep.target=this
  let val=vm
  let arrayKey=exp.split('.')
  arrayKey.forEach((key)=>{
    val=val[key]
  })
  Dep.target=null
}

Watcher.prototype.update=function(){
  let exp=this.exp
  let arrayKey=exp.split('.')
  let val=this.vm
  arrayKey.forEach((key)=>{
    val=val[key]
  })
  this.fn(val)
}





