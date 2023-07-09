<script lang="ts">
  import { getSupabase } from "../model/supabase";

  export let supabase_url: string;
  export let supabase_key: string;
  export let table: "servers" | "players";

  let count = 0;
  let digits: [string, number][] = [["0", 0]];

  const supabase = getSupabase(supabase_url, supabase_key);

  function updateDigits() {
    let countString = count.toString();
    for (let i = 0; i < countString.length; i++) {
      if (digits.length <= i) {
        digits.push([countString[i], Math.random()]);
      } else {
        if (digits[i][0] === countString[i]) continue;
        digits[i][1] = Math.random();

        setTimeout(() => {
          digits[i][0] = countString[i];
        }, 500);
      }
    }
  }

  function updateCount() {
    supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .then((res) => {
        count = res.count!;
        updateDigits();
      });
  }

  setInterval(() => {
    updateCount();
  }, 10000);
  updateCount();

  const channel = supabase
    .channel("schema-db-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: table,
      },
      () => {
        count++;
        if (table === "players") {
        }
        updateDigits();
      }
    )
    .subscribe();
</script>

<div class="flex">
  {#each digits as digit}
    {#key digit[1]}
      <div class="digit">
        {digit[0]}
      </div>
    {/key}
  {/each}
</div>

<style>
  .flex {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .digit {
    font-size: 3rem;
    font-weight: bold;
    margin: 0 0.3rem;
    animation: fly 1s ease-in-out;
  }

  @keyframes fly {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-100px);
      animation-timing-function: steps(1);
    }
    51% {
      transform: translateY(100px);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
